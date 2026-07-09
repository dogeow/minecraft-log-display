<?php

namespace App\Services;

use xPaw\MinecraftPing;
use xPaw\MinecraftQuery;
use Illuminate\Support\Facades\Cache;

class MinecraftServerStatus
{
    private const DEFAULT_STYLE = [
        'color' => null,
        'bold' => false,
        'italic' => false,
        'underlined' => false,
        'strikethrough' => false,
        'obfuscated' => false,
    ];

    private const COLOR_CODE_MAP = [
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

    private const COLOR_NAME_MAP = [
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

    /** @var array<string, array{info: mixed, players: mixed, error: string|null}> */
    private array $queryConnection;

    /** @var array<string, array{info: mixed, error: string|null}> */
    private array $pingConnection;

    /**
     * 获取 Minecraft 服务器状态.
     *
     * 通过 Ping 和 Query 两种协议查询服务器信息，包括在线玩家、版本、MOTD 等，
     * 并将原始数据规范化为前端友好的结构。
     */
    public function getServerStatus(): array
    {
        $host = (string) config('minecraft.server.ip');
        $port = (int) config('minecraft.server.port');
        $queryPort = (int) config('minecraft.server.query_port');
        $timeout = (float) config('minecraft.server.timeout', 1);
        $cacheSeconds = (int) config('minecraft.server.status_cache_ttl', 10);

        if ($cacheSeconds <= 0) {
            return $this->computeServerStatus($host, $port, $queryPort, $timeout);
        }

        $cacheKey = $this->buildCacheKey($host, $port, $queryPort, $timeout);

        return Cache::remember(
            $cacheKey,
            now()->addSeconds($cacheSeconds),
            fn () => $this->computeServerStatus($host, $port, $queryPort, $timeout),
        );
    }

    protected function computeServerStatus(string $host, int $port, int $queryPort, float $timeout): array
    {
        $this->pingConnection = [];
        $this->queryConnection = [];

        $startedAt = microtime(true);
        $pingResult = $this->pingServer($host, $port, $timeout);
        $queryResult = $this->queryServer($host, $queryPort, $timeout);

        return $this->buildServerStatus(
            $pingResult,
            $queryResult,
            microtime(true) - $startedAt,
            $host,
        );
    }

    protected function buildCacheKey(string $host, int $port, int $queryPort, float $timeout): string
    {
        return 'minecraft-server-status:' . sha1(implode('|', [
            $host,
            $port,
            $queryPort,
            $timeout,
        ]));
    }

    /**
     * 通过 Ping 协议查询 Minecraft 服务器基本信息.
     *
     * 使用 xPaw MinecraftPing 库获取服务器信息，若 Query() 失败
     * 则降级到 QueryOldPre17() 以兼容旧版本服务器。
     *
     * @return array{info: mixed, error: string|null}
     */
    protected function pingServer(string $host, int $port, float $timeout): array
    {
        $key = "{$host}:{$port}";
        if (isset($this->pingConnection[$key])) {
            return $this->pingConnection[$key];
        }

        $ping = null;

        try {
            $ping = new MinecraftPing($host, $port, $timeout);
            $info = $ping->Query();

            if ($info === false) {
                $ping->Close();
                $ping->Connect();
                $info = $ping->QueryOldPre17();
            }

            $result = [
                'info' => is_array($info) ? $info : [],
                'error' => null,
            ];
        } catch (\Throwable) {
            $result = [
                'info' => [],
                'error' => '服务器 Ping 不可用',
            ];
        } finally {
            if (isset($ping) && $ping instanceof MinecraftPing) {
                $ping->Close();
            }
        }

        $this->pingConnection[$key] = $result;

        return $result;
    }

    /**
     * 通过 Query 协议查询 Minecraft 服务器详细信息和玩家列表.
     *
     * 使用 xPaw MinecraftQuery 库获取服务器完整信息，
     * 包括在线玩家名称列表、插件信息等。
     *
     * @return array{info: mixed, players: mixed, error: string|null}
     */
    protected function queryServer(string $host, int $port, float $timeout): array
    {
        $key = "{$host}:{$port}";
        if (isset($this->queryConnection[$key])) {
            return $this->queryConnection[$key];
        }

        try {
            $query = new MinecraftQuery;
            $query->Connect($host, $port, $timeout);
            $info = $query->GetInfo();
            $players = $query->GetPlayers();

            $result = [
                'info' => is_array($info) ? $info : [],
                'players' => is_array($players) ? array_values($players) : [],
                'error' => null,
            ];
        } catch (\Throwable) {
            $result = [
                'info' => [],
                'players' => [],
                'error' => '服务器 Query 不可用',
            ];
        }

        $this->queryConnection[$key] = $result;

        return $result;
    }

    /**
     * 将 Ping 和 Query 结果合并为规范化的服务器状态结构.
     *
     * 优先使用 Query 数据，Ping 数据作为补充填充缺失字段（如版本、在线人数等）。
     *
     * @param array{info: mixed, error: string|null} $pingResult Ping 查询结果
     * @param array{info: mixed, players: mixed, error: string|null} $queryResult Query 查询结果
     */
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
            $normalizedQueryInfo['HostName'] !== '未知' ? (string) $normalizedQueryInfo['HostName'] : '',
        );

        $pingError = $pingResult['error'] ?? null;
        $queryError = $queryResult['error'] ?? null;

        return [
            'info' => $info,
            'queryInfo' => $normalizedQueryInfo,
            'players' => $players,
            'timer' => number_format($elapsed, 4, '.', ''),
            'favicon' => $this->normalizeFavicon($info),
            'is_online' => $pingError === null,
            'query_available' => $queryAvailable,
            'query_unavailable' => !$queryAvailable && $pingError === null,
            'errors' => array_values(array_filter([$pingError, $queryError])),
            'display_name' => $motd['plain'],
            'display_subtitle' => $pingError === null ? '服务器在线' : '服务器离线或不可访问',
            'motd_html' => $motd['html'],
            'version' => (string) $normalizedQueryInfo['Version'],
            'server_flavor' => empty($normalizedQueryInfo['Plugins']) ? '原版服务器' : 'Mod 服务器',
            'software' => $normalizedQueryInfo['Software'] !== ''
                ? (string) $normalizedQueryInfo['Software']
                : ($queryAvailable ? 'Vanilla' : 'Query 不可用'),
            'game_mode' => match ($normalizedQueryInfo['GameType']) {
                'SMP' => '多人游戏',
                '' => '未知',
                default => '单人游戏',
            },
            'online_players' => (int) $normalizedQueryInfo['Players'],
            'max_players' => (int) $normalizedQueryInfo['MaxPlayers'],
            'endpoint' => sprintf('%s:%d', $host, config('minecraft.server.port')),
        ];
    }

    /**
     * 构建 MOTD (Message of the Day) 的纯文本和 HTML 两个版本.
     *
     * @param mixed $description 服务器 MOTD 原始数据，支持新旧两种 JSON 格式
     * @param string $hostName 服务器名称（当 description 为空时作为后备）
     * @return array{plain: string, html: string} plain 为纯文本，html 为带样式的 HTML
     */
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

    /**
     * 递归提取 Minecraft JSON 文本中的文本片段列表.
     *
     * 支持新旧两种 MOTD 格式：
     * - 新格式 (1.7+)：JSON TextComponent，包含 text/translate/extra 等字段
     * - 旧格式：纯字符串或包含 legacy 字段的对象
     *
     * @param mixed $description MOTD 原始数据
     * @param array|null $parentStyle 继承自父级的样式（用于递归传递）
     * @return array<int, array{text: string, style: array{color: ?string, bold: bool, italic: bool, underlined: bool, strikethrough: bool, obfuscated: bool}}>
     */
    protected function extractMinecraftFragments(mixed $description, ?array $parentStyle = null): array
    {
        $style = $parentStyle ?? self::DEFAULT_STYLE;

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

    /**
     * 解析旧版 Minecraft 纯文本 MOTD 中的 § 格式代码.
     *
     * 处理 Minecraft 遗留的颜色代码和格式代码（如 §c 表示红色、§l 表示加粗），
     * 以及 §xRRGGBB 十六进制颜色格式。将文本拆分为带样式的片段列表。
     *
     * @param string $text 包含 § 代码的原始文本
     * @param array|null $baseStyle 继承的基础样式
     * @return array<int, array{text: string, style: array{color: ?string, bold: bool, italic: bool, underlined: bool, strikethrough: bool, obfuscated: bool}}>
     */
    protected function parseLegacyMinecraftText(string $text, ?array $baseStyle = null): array
    {
        $style = $baseStyle ?? self::DEFAULT_STYLE;
        $text = str_replace(["\r\n", "\r", "\f"], "\n", $text);
        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);

        if ($chars === false) {
            return [['text' => $text, 'style' => $style]];
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

            $code = $chars[$index + 1];
            $hexColor = $this->parseHexColor($chars, $index, $charCount);

            if ($buffer !== '') {
                $fragments[] = ['text' => $buffer, 'style' => $style];
                $buffer = '';
            }

            if ($hexColor !== null) {
                $style = array_merge(self::DEFAULT_STYLE, ['color' => $hexColor]);
                $index += 13;

                continue;
            }

            $style = $this->applyLegacyFormattingCode($style, strtolower($code));
            $index++;
        }

        if ($buffer !== '') {
            $fragments[] = ['text' => $buffer, 'style' => $style];
        }

        return $fragments;
    }

    /**
     * 从 §x 十六进制颜色序列中解析出颜色值.
     *
     * Minecraft 1.16+ 支持 §x§R§R§G§G§B§B 格式的十六进制颜色，
     * 例如 §x§F§F§0§0§0§0 表示黑色 #FF0000。
     *
     * @param array<int, string> $chars 文本字符数组
     * @param int $index 当前 § 符号的索引位置
     * @param int $charCount 字符数组总长度
     * @return string|null 解析出的十六进制颜色（如 #FF0000）或 null（非十六进制颜色序列）
     */
    private function parseHexColor(array $chars, int $index, int $charCount): ?string
    {
        if ($chars[$index + 1] !== 'x' || $index + 13 >= $charCount) {
            return null;
        }

        $hexDigits = '';
        for ($hexIndex = 0; $hexIndex < 6; $hexIndex++) {
            $sectionIndex = $index + 2 + ($hexIndex * 2);
            $digitIndex = $sectionIndex + 1;

            if (($chars[$sectionIndex] ?? null) !== '§' || !ctype_xdigit($chars[$digitIndex] ?? '')) {
                return null;
            }

            $hexDigits .= $chars[$digitIndex];
        }

        return '#' . strtoupper($hexDigits);
    }

    /**
     * 将 Minecraft § 格式代码应用到当前样式.
     *
     * 支持：
     * - 颜色代码 §0-§f（映射到 COLOR_CODE_MAP）
     * - 十六进制颜色 §#RRGGBB
     * - 格式代码 §k(乱码) §l(加粗) §m(删除线) §n(下划线) §o(斜体) §r(重置)
     *
     * @param array $style 当前样式数组
     * @param string $code 单字符格式代码或十六进制颜色
     */
    protected function applyLegacyFormattingCode(array $style, string $code): array
    {
        if (str_starts_with($code, '#')) {
            return array_merge(self::DEFAULT_STYLE, ['color' => $code]);
        }

        if (isset(self::COLOR_CODE_MAP[$code])) {
            return array_merge(self::DEFAULT_STYLE, ['color' => self::COLOR_CODE_MAP[$code]]);
        }

        return match ($code) {
            'k' => array_merge($style, ['obfuscated' => true]),
            'l' => array_merge($style, ['bold' => true]),
            'm' => array_merge($style, ['strikethrough' => true]),
            'n' => array_merge($style, ['underlined' => true]),
            'o' => array_merge($style, ['italic' => true]),
            'r' => self::DEFAULT_STYLE,
            default => $style,
        };
    }

    /**
     * 将 JSON TextComponent 中的样式属性应用到当前样式.
     *
     * @param array $style 当前继承的样式
     * @param array $component JSON TextComponent 节点，包含 color/bold/italic 等属性
     */
    protected function applyComponentStyle(array $style, array $component): array
    {
        if (isset($component['color']) && is_string($component['color'])) {
            $resolved = $this->resolveMinecraftColor($component['color']);
            if ($resolved !== null) {
                $style['color'] = $resolved;
            }
        }

        foreach (['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'] as $key) {
            if (array_key_exists($key, $component)) {
                $style[$key] = (bool) $component[$key];
            }
        }

        return $style;
    }

    /**
     * 将文本片段列表渲染为带样式的 HTML 字符串.
     *
     * 每个片段根据其样式生成对应的 CSS 并包裹在 <span> 标签中，
     * 支持颜色、加粗、斜体、下划线、删除线、乱码效果。
     *
     * @param array $fragments 文本片段列表，每项包含 text 和 style
     */
    protected function renderMinecraftFragmentsAsHtml(array $fragments): string
    {
        $html = '';

        foreach ($fragments as $fragment) {
            $text = $fragment['text'] ?? '';
            if ($text === '') {
                continue;
            }

            $style = is_array($fragment['style'] ?? null) ? $fragment['style'] : self::DEFAULT_STYLE;
            $escaped = nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8'), false);
            $css = $this->buildFragmentCss($style);

            if ($css === '') {
                $html .= $escaped;

                continue;
            }

            $html .= sprintf(
                '<span style="%s">%s</span>',
                htmlspecialchars($css, ENT_QUOTES, 'UTF-8'),
                $escaped,
            );
        }

        return $html;
    }

    /**
     * 根据样式属性构建 CSS 样式字符串.
     *
     * @param array $style 样式属性数组，包含 color/bold/italic/underlined/strikethrough/obfuscated
     */
    private function buildFragmentCss(array $style): string
    {
        $parts = [];

        if ($style['color'] !== null) {
            $parts[] = 'color: ' . $style['color'];
        }
        if ($style['bold']) {
            $parts[] = 'font-weight: 700';
        }
        if ($style['italic']) {
            $parts[] = 'font-style: italic';
        }

        $decorations = [];
        if ($style['underlined']) {
            $decorations[] = 'underline';
        }
        if ($style['strikethrough']) {
            $decorations[] = 'line-through';
        }
        if ($decorations !== []) {
            $parts[] = 'text-decoration: ' . implode(' ', $decorations);
        }

        if ($style['obfuscated']) {
            $parts[] = 'filter: blur(0.08em)';
        }

        return implode('; ', $parts);
    }

    /**
     * 将 Minecraft 颜色名或十六进制值解析为标准化的十六进制颜色字符串.
     *
     * 支持 named colors (如 'red', 'dark_blue') 和已格式化的 hex (如 '#FF5555')。
     * 如果颜色格式无效或不在已知颜色映射中则返回 null。
     *
     * @param string $color Minecraft 颜色名或十六进制颜色值
     */
    protected function resolveMinecraftColor(string $color): ?string
    {
        if (preg_match('/^#[0-9a-f]{6}$/i', $color) === 1) {
            return strtoupper($color);
        }

        return self::COLOR_NAME_MAP[strtolower($color)] ?? null;
    }

    /**
     * 规范化服务器图标 (favicon) 数据.
     *
     * 从服务器 ping 结果中提取 data URI 格式的 favicon，
     * 去除换行符后返回标准格式的 data URI。
     *
     * @param array $info 服务器 ping 返回的 info 数据
     */
    protected function normalizeFavicon(array $info): ?string
    {
        $favicon = $info['favicon'] ?? null;
        if (!is_string($favicon) || $favicon === '' || !str_starts_with($favicon, 'data:image/')) {
            return null;
        }

        return str_replace("\n", '', $favicon);
    }
}
