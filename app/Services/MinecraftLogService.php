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

    public function isMaliciousUser(string $username): bool
    {
        return (bool) preg_match(self::MALICIOUS_USER_PATTERN, $username);
    }

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

    public function updateDailyStats(User $user, Login $login, int $duration): void
    {
        $date = $login->created_at->toDateString();
        $dailyStat = $user->dailyStats()->firstOrCreate(
            ['date' => $date],
            ['online_time' => 0],
        );
        $dailyStat->increment('online_time', $duration);
    }

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

    public function cacheUuid(string $username, string $uuid): void
    {
        $this->uuidCache[$username] = $uuid;
    }

    public function findUuidFromCache(string $username): ?string
    {
        $uuid = $this->uuidCache[$username] ?? null;
        unset($this->uuidCache[$username]);

        return $uuid;
    }

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

    private function extractDateFromFile(string $currentFile): string
    {
        if (!preg_match(self::REGEX_DATE_FILE, $currentFile, $m)) {
            throw new \Exception('无法从文件名解析日期: ' . $currentFile);
        }

        return $m[1];
    }
}
