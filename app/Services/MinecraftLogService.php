<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Throwable;

class MinecraftLogService
{
    private array $uuidCache = [];

    private const MALICIOUS_USER_PATTERN = '/^Cornbread\d+$/';
    private const REGEX_LOGIN_POSITION = '/^\[(.*?)\] \[Server thread\/INFO\]: %s\[(.*?)\] logged in with entity id (\d+) at \(\[(.*?)\](.*?), (.*?), (.*?)\)/';
    private const REGEX_DATE_FILE = '/^(\d{4}-\d{2}-\d{2})-\d+\.log$/';
    private const REGEX_LOG_TIME = '/(\d{2}:\d{2}:\d{2})/';

    /**
     * 检查用户名是否为恶意用户.
     *
     * 匹配 ^Cornbread\d+$ 模式，跳过所有操作。
     */
    public function isMaliciousUser(string $username): bool
    {
        return (bool) preg_match(self::MALICIOUS_USER_PATTERN, $username);
    }

    /**
     * 处理用户登录事件.
     *
     * 创建 Login 记录，若提供日志路径则提取登录位置信息，
     * 更新用户在线状态和最后登录时间。跳过恶意用户和 1 分钟内重复登录。
     */
    public function handleLogin(string $username, ?string $uuid, Carbon $timestamp, ?string $logPath = null, ?string $currentFile = null): ?Login
    {
        if ($this->isMaliciousUser($username)) {
            return null;
        }

        $user = User::firstOrCreate(
            ['username' => $username],
            ['uuid' => $uuid],
        );

        $lastLogin = $user->logins()->latest()->first();
        if ($lastLogin && $lastLogin->created_at->diffInMinutes($timestamp) <= 1) {
            return null;
        }

        $login = Login::create([
            'user_id' => $user->id,
            'login_at' => $timestamp,
            'created_at' => $timestamp,
        ]);

        if ($logPath && $currentFile) {
            $this->processLoginLocation($login, $user, $username, $logPath, $currentFile);
        }

        $user->update([
            'is_online' => true,
            'last_login_at' => $timestamp,
        ]);

        return $login;
    }

    /**
     * 处理用户登出事件.
     *
     * 找到当前用户的未登出登录记录，计算在线时长并更新，
     * 累加用户总在线时间和每日统计。跳过恶意用户。
     */
    public function handleLogout(string $username, Carbon $timestamp): void
    {
        if ($this->isMaliciousUser($username)) {
            return;
        }

        $user = User::where('username', $username)->first();
        if (!$user) {
            return;
        }

        $login = $user->logins()->whereNull('logout_at')->latest()->first();
        if (!$login) {
            return;
        }

        if ($timestamp->lt($login->login_at)) {
            return;
        }

        $duration = $login->login_at->diffInSeconds($timestamp);
        if ($duration <= 0) {
            return;
        }

        $login->update([
            'logout_at' => $timestamp,
            'duration' => $duration,
        ]);

        $user->update([
            'is_online' => false,
            'last_logout_at' => $timestamp,
            'total_online_time' => max(0, $user->total_online_time + $duration),
        ]);

        $this->updateDailyStats($user, $login, $duration);
    }

    /**
     * 更新用户每日在线时长统计.
     *
     * 根据登录日期创建或更新 DailyStat 记录，累加当天在线秒数。
     */
    public function updateDailyStats(User $user, Login $login, int $duration): void
    {
        $date = $login->created_at->toDateString();
        $dailyStat = $user->dailyStats()->firstOrCreate(
            ['date' => $date],
            ['online_time' => 0],
        );
        $dailyStat->increment('online_time', $duration);
    }

    /**
     * 从日志文件中提取用户登录时的位置信息并写入数据库.
     *
     * 匹配 "username logged in with entity id X at (world, x, y, z)" 格式，
     * 提取 IP（从方括号前的地址解析）、世界名和三维坐标。
     */
    public function processLoginLocation(Login $login, User $user, string $username, string $logPath, string $currentFile): void
    {
        $filePath = $logPath . '/' . $currentFile;
        if (!File::exists($filePath)) {
            return;
        }

        $pattern = sprintf(
            self::REGEX_LOGIN_POSITION,
            preg_quote($username, '/'),
        );

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            return;
        }

        try {
            while (($line = fgets($handle)) !== false) {
                if (preg_match($pattern, $line, $m)) {
                    LoginLocation::create([
                        'login_id' => $login->id,
                        'user_id' => $user->id,
                        'world' => $m[4],
                        'x' => (float) $m[5],
                        'y' => (float) $m[6],
                        'z' => (float) $m[7],
                        'entity_id' => $m[3],
                        'ip' => trim(explode(':', $m[2])[0], '/'),
                    ]);

                    return;
                }
            }
        } catch (Throwable $e) {
            Log::warning('读取登录位置信息失败: ' . $e->getMessage());
        } finally {
            fclose($handle);
        }
    }

    /**
     * 处理聊天消息.
     *
     * 创建 ChatMessage 记录。跳过恶意用户，自动创建关联用户。
     */
    public function handleChatMessage(string $username, string $content, Carbon $timestamp): ?ChatMessage
    {
        if ($this->isMaliciousUser($username)) {
            return null;
        }

        $user = User::firstOrCreate(['username' => $username]);

        return ChatMessage::create([
            'user_id' => $user->id,
            'username' => $username,
            'content' => $content,
            'sent_at' => $timestamp,
            'created_at' => $timestamp,
        ]);
    }

    /**
     * 将用户名与 UUID 的映射存入缓存.
     *
     * 在日志解析过程中，User Authenticator 行出现时调用，
     * 后续登录行通过 findUuidFromCache 获取。
     */
    public function cacheUuid(string $username, string $uuid): void
    {
        $this->uuidCache[$username] = $uuid;
    }

    /**
     * 从缓存中取出用户 UUID 并清除.
     *
     * 每个 UUID 仅可使用一次，取出后立即从缓存中删除。
     */
    public function findUuidFromCache(string $username): ?string
    {
        $uuid = $this->uuidCache[$username] ?? null;
        unset($this->uuidCache[$username]);

        return $uuid;
    }

    /**
     * 解析 Minecraft 日志行中的时间戳.
     *
     * 日期从文件名获取（latest.log 使用当天），时间从日志行 HH:MM:SS 提取。
     */
    public function parseTimestamp(string $timeString, string $currentFile): Carbon
    {
        $date = $currentFile === 'latest.log'
            ? now()->toDateString()
            : $this->extractDateFromFile($currentFile);

        if (!preg_match(self::REGEX_LOG_TIME, $timeString, $m)) {
            throw new \Exception('无法从日志行解析时间: ' . $timeString);
        }

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $m[1]);
    }

    /**
     * 从日志文件名提取日期部分.
     *
     * 匹配 YYYY-MM-DD-N.log 格式，返回 YYYY-MM-DD。
     */
    private function extractDateFromFile(string $currentFile): string
    {
        if (!preg_match(self::REGEX_DATE_FILE, $currentFile, $m)) {
            throw new \Exception('无法从文件名解析日期: ' . $currentFile);
        }

        return $m[1];
    }
}
