<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\MinecraftLogService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

class ProcessMinecraftLogs extends Command
{
    protected $signature = 'minecraft:process-logs';
    protected $description = '处理 Minecraft 服务器日志';

    private string $logPath;
    private string $logFile;
    private int $lastProcessedLine;

    private const REGEX_UUID = '/^\[(.*?)\] \[User Authenticator.*?\]: UUID of player (.*?) is ([0-9a-f-]+)/';
    private const REGEX_LOGIN = '/^\[(.*?)\] \[Craft Scheduler Thread.*?AuthMe\/INFO\]: \[AuthMe\] (.*?) logged in/';
    private const REGEX_LOGOUT = '/^\[(.*?)\] \[Server thread\/INFO\]: (.*?) left the game/';
    private const REGEX_CHAT = '/^\[(.*?)\] \[Async Chat Thread.*?\/INFO\]: \[Not Secure\] <(.*?)> (.*)/';

    public function __construct(
        private readonly MinecraftLogService $logService,
    ) {
        parent::__construct();
        $this->logPath = config('minecraft.log_path');
        $this->logFile = $this->logPath . '/latest.log';
        $this->lastProcessedLine = 0;
    }

    /**
     * 处理 Minecraft 服务器实时日志.
     *
     * 读取 latest.log 从上次处理位置之后的增量行，
     * 识别登录、登出、聊天等事件并写入数据库。
     */
    public function handle(): int
    {
        if (!file_exists($this->logFile)) {
            $this->warn('日志文件不存在: ' . $this->logFile);

            return 0;
        }

        $lastLine = (int) Cache::get('minecraft_log_last_line', 0);
        $currentLineCount = $this->countLines($this->logFile);

        if ($currentLineCount < $lastLine) {
            $lastLine = 0;
        }

        $this->lastProcessedLine = $lastLine;

        $handle = fopen($this->logFile, 'r');
        if ($handle === false) {
            $this->error('无法打开日志文件: ' . $this->logFile);

            return 1;
        }

        try {
            $lineNumber = 0;
            while (($line = fgets($handle)) !== false) {
                $lineNumber++;
                if ($lineNumber <= $this->lastProcessedLine) {
                    continue;
                }
                $this->processLine($line);
            }
            $processedUpTo = $lineNumber;
        } catch (Throwable $e) {
            $this->error('处理日志出错: ' . $e->getMessage());

            return 1;
        } finally {
            fclose($handle);
        }

        Cache::put('minecraft_log_last_line', $processedUpTo, now()->addDays(1));
        $this->info('处理到第 ' . $processedUpTo . ' 行');

        return 0;
    }

    /**
     * 统计文件行数.
     *
     * 流式读取文件，每读一行计数器加一，用于判断日志文件是否被截断重写。
     */
    private function countLines(string $path): int
    {
        $count = 0;
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return 0;
        }
        while (fgets($handle) !== false) {
            $count++;
        }
        fclose($handle);

        return $count;
    }

    /**
     * 解析单行日志并分发到对应处理方法.
     *
     * 依次匹配 UUID、登录、登出、聊天消息等日志行格式，
     * 异常不中断后续行处理。
     */
    private function processLine(string $line): void
    {
        // UUID 缓存
        if (preg_match(self::REGEX_UUID, $line, $m)) {
            $this->logService->cacheUuid($m[2], $m[3]);

            return;
        }

        if (!str_starts_with(trim($line), '[')) {
            return;
        }

        // 登录
        if (preg_match(self::REGEX_LOGIN, $line, $m)) {
            try {
                $username = $m[2];
                $timestamp = $this->logService->parseTimestamp($line, 'latest.log');
                $uuid = $this->logService->findUuidFromCache($username);
                User::where('username', $username)->update(['last_login_at' => $timestamp]);
                $this->logService->handleLogin($username, $uuid, $timestamp, $this->logPath, 'latest.log');
            } catch (Throwable $e) {
                $this->error('处理登录出错: ' . $e->getMessage());
            }

            return;
        }

        // 登出
        if (preg_match(self::REGEX_LOGOUT, $line, $m)) {
            try {
                $username = $m[2];
                $timestamp = $this->logService->parseTimestamp($line, 'latest.log');
                $user = User::where('username', $username)->first();
                if ($user) {
                    $this->logService->handleLogout($username, $timestamp);
                }
            } catch (Throwable $e) {
                $this->error('处理登出出错: ' . $e->getMessage());
            }

            return;
        }

        // 聊天消息
        if (preg_match(self::REGEX_CHAT, $line, $m)) {
            try {
                $username = $m[2];
                $content = $m[3];
                $timestamp = $this->logService->parseTimestamp($line, 'latest.log');
                $this->logService->handleChatMessage($username, $content, $timestamp);
            } catch (Throwable $e) {
                $this->error('处理聊天消息出错: ' . $e->getMessage());
            }

            return;
        }
    }
}
