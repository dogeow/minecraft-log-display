<?php

namespace App\Console\Commands;

use App\Models\ChatMessage;
use App\Models\DailyStat;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

class ImportHistoryLogs extends Command
{
    protected $signature = 'minecraft:import-history';
    protected $description = '导入历史日志文件';

    private array $currentLogin = [];
    private string $currentFile = '';
    private array $uuidCache = [];

    /** @var array<string, array{ip: string, world: string, x: float, y: float, z: float, entity_id: string}>|null */
    private ?array $loginPositionCache = null;

    private const MALICIOUS_USER_PATTERN = '/^Cornbread\d+$/';

    private const REGEX_UUID = '/^\[(.*?)\] \[User Authenticator.*?\]: UUID of player (.*?) is ([0-9a-f-]+)/';
    private const REGEX_LOGIN = '/^\[(.*?)\] \[Craft Scheduler Thread.*?AuthMe\/INFO\]: \[AuthMe\] (.*?) logged in/';
    private const REGEX_LOGOUT = '/^\[(.*?)\] \[Server thread\/INFO\]: (.*?) left the game/';
    private const REGEX_SCIENTIST = '/^\[(.*?)\] \[Server thread\/WARN\]: (.*?) moved wrongly!/';
    private const REGEX_CHAT = '/^\[(.*?)\] \[Async Chat Thread.*?\/INFO\]: \[Not Secure\] <(.*?)> (.*)/';
    private const REGEX_LOGIN_POSITION = '/^\[(.*?)\] \[Server thread\/INFO\]: %s\[(.*?)\] logged in with entity id (\d+) at \(\[(.*?)\](.*?), (.*?), (.*?)\)/';
    private const REGEX_DATE_FILE = '/^(\d{4}-\d{2}-\d{2})-\d+\.log$/';
    private const REGEX_LOG_TIME = '/(\d{2}:\d{2}:\d{2})/';

    private string $logPath;

    public function __construct()
    {
        parent::__construct();
        $this->logPath = config('minecraft.log_path');
    }

    public function handle(): int
    {
        try {
            $this->quiet = false;

            if (!File::exists($this->logPath)) {
                $this->error("日志目录不存在: {$this->logPath}");

                return 1;
            }

            $logFiles = $this->getLogFiles();

            $this->info('找到 ' . $logFiles->count() . ' 个日志文件');

            if ($this->confirm('是否清空现有数据重新导入？')) {
                $this->clearData();
            }

            foreach ($logFiles as $file) {
                $this->currentFile = $file->getFilename();
                $this->info('处理文件: ' . $this->currentFile);
                $this->processFile($file->getPathname());
            }

            foreach ($this->currentLogin as $username => $loginTime) {
                $this->handleLogout($username, now());
            }

            $this->info('历史日志导入完成');

            return 0;
        } catch (Throwable $e) {
            $this->error('导入过程出错: ' . $e->getMessage());

            return 1;
        }
    }

    private function getLogFiles(): \Illuminate\Support\Collection
    {
        return collect(File::files($this->logPath))
            ->filter(function ($file) {
                $filename = $file->getFilename();

                return $filename === 'latest.log' || preg_match('/^\d{4}-\d{2}-\d{2}-\d+\.log$/', $filename);
            })
            ->sortBy(function ($file) {
                return $file->getFilename() === 'latest.log' ? '9999-99-99' : $file->getFilename();
            });
    }

    private function clearData(): void
    {
        $this->info('清空数据...');
        User::truncate();
        Login::truncate();
        DailyStat::truncate();
        ChatMessage::truncate();
        $this->info('数据清空完成');
    }

    private function processFile(string $path): void
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->error("无法打开文件: {$path}");

            return;
        }

        try {
            $lineNumber = 0;
            while (($line = fgets($handle)) !== false) {
                $lineNumber++;
                $this->processLine($line);
            }
        } catch (Throwable $e) {
            $this->error("处理文件 {$this->currentFile} 出错: " . $e->getMessage());
            if (!$this->confirm('是否继续处理其他文件？')) {
                fclose($handle);

                return;
            }
        } finally {
            fclose($handle);
        }
    }

    private function processLine(string $line): void
    {
        // UUID 缓存
        if (preg_match(self::REGEX_UUID, $line, $m)) {
            $this->uuidCache[$m[2]] = $m[3];

            return;
        }

        if (!str_starts_with(trim($line), '[')) {
            return;
        }

        // 登录
        if (preg_match(self::REGEX_LOGIN, $line, $m)) {
            try {
                $timestamp = $this->parseTimestamp($m[1]);
                $username = $m[2];
                $uuid = $this->findUuid($username);
                $this->handleLogin($username, $uuid, $timestamp);
            } catch (Throwable $e) {
                $this->error('处理登录信息出错: ' . $e->getMessage());
            }

            return;
        }

        // 登出
        if (preg_match(self::REGEX_LOGOUT, $line, $m)) {
            try {
                $timestamp = $this->parseTimestamp($m[1]);
                $this->handleLogout($m[2], $timestamp);
            } catch (Throwable $e) {
                $this->error('处理登出信息出错: ' . $e->getMessage());
            }

            return;
        }

        // 科学家标记
        if (preg_match(self::REGEX_SCIENTIST, $line, $m)) {
            try {
                $username = $m[2];
                $user = User::where('username', $username)->first();
                if ($user && !$user->is_scientist) {
                    $user->update(['is_scientist' => true]);
                    $this->info("将用户 {$username} 标记为科学家");
                }
            } catch (Throwable $e) {
                $this->error('处理科学家标记出错: ' . $e->getMessage());
            }

            return;
        }

        // 聊天消息
        if (preg_match(self::REGEX_CHAT, $line, $m)) {
            try {
                $timestamp = $this->parseTimestamp($m[1]);
                $username = $m[2];
                $content = $m[3];
                if ($this->isMaliciousUser($username)) {
                    return;
                }
                $user = User::firstOrCreate(['username' => $username]);
                ChatMessage::create([
                    'user_id' => $user->id,
                    'username' => $username,
                    'content' => $content,
                    'sent_at' => $timestamp,
                    'created_at' => $timestamp,
                ]);
            } catch (Throwable $e) {
                $this->error('处理聊天消息出错: ' . $e->getMessage());
            }

            return;
        }
    }

    private function parseTimestamp(string $timeString): Carbon
    {
        $date = $this->currentFile === 'latest.log'
            ? now()->toDateString()
            : $this->extractDateFromFile();

        if (!preg_match(self::REGEX_LOG_TIME, $timeString, $m)) {
            throw new \Exception('无法从日志行解析时间: ' . $timeString);
        }

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $m[1]);
    }

    private function extractDateFromFile(): string
    {
        if (!preg_match(self::REGEX_DATE_FILE, $this->currentFile, $m)) {
            throw new \Exception('无法从文件名解析日期: ' . $this->currentFile);
        }

        return $m[1];
    }

    private function handleLogin(string $username, string $uuid, Carbon $timestamp): void
    {
        if ($this->isMaliciousUser($username)) {
            return;
        }

        $user = User::firstOrCreate(['username' => $username, 'uuid' => $uuid]);

        if (isset($this->currentLogin[$username])) {
            $this->handleLogout($username, $timestamp);
        }

        $lastLogin = $user->logins()->latest()->first();
        if ($lastLogin && $lastLogin->created_at->diffInMinutes($timestamp) <= 1) {
            return;
        }

        $this->currentLogin[$username] = $timestamp;

        $login = Login::create([
            'user_id' => $user->id,
            'login_at' => $timestamp,
            'created_at' => $timestamp,
        ]);

        $position = $this->findLoginPosition($username);
        if ($position) {
            LoginLocation::create([
                'login_id' => $login->id,
                'user_id' => $user->id,
                'world' => $position['world'],
                'x' => $position['x'],
                'y' => $position['y'],
                'z' => $position['z'],
                'entity_id' => $position['entity_id'],
                'ip' => $position['ip'],
            ]);
        }

        $user->update([
            'is_online' => true,
            'last_login_at' => $timestamp,
        ]);

        $this->info("用户 {$username} 在 {$timestamp} 登录");
    }

    private function handleLogout(string $username, Carbon $timestamp): void
    {
        if ($this->isMaliciousUser($username)) {
            return;
        }

        if (!isset($this->currentLogin[$username])) {
            return;
        }

        $user = User::where('username', $username)->first();
        if (!$user) {
            unset($this->currentLogin[$username]);

            return;
        }

        $login = $user->logins()->whereNull('logout_at')->latest()->first();
        if (!$login) {
            unset($this->currentLogin[$username]);

            return;
        }

        if ($timestamp->lt($login->login_at)) {
            $this->warn("警告: {$username} 的登出时间早于登录时间，跳过");

            return;
        }

        $duration = $login->login_at->diffInSeconds($timestamp);
        if ($duration <= 0) {
            unset($this->currentLogin[$username]);

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

        $this->info("用户 {$username} 在 {$timestamp} 登出，本次在线时长: " . gmdate('H:i:s', $duration));

        unset($this->currentLogin[$username]);
    }

    private function updateDailyStats(User $user, Login $login, int $duration): void
    {
        $date = $login->created_at->toDateString();
        $dailyStat = $user->dailyStats()->firstOrCreate(
            ['date' => $date],
            ['online_time' => 0],
        );
        $dailyStat->increment('online_time', $duration);
    }

    private function findUuid(string $username): string
    {
        if (isset($this->uuidCache[$username])) {
            $uuid = $this->uuidCache[$username];
            unset($this->uuidCache[$username]);

            return $uuid;
        }

        throw new \Exception('无法找到用户 ' . $username . ' 的 UUID');
    }

    /**
     * @return array{ip: string, world: string, x: float, y: float, z: float, entity_id: string}|null
     */
    private function findLoginPosition(string $username): ?array
    {
        if ($this->loginPositionCache !== null && isset($this->loginPositionCache[$username])) {
            return $this->loginPositionCache[$username];
        }

        $filePath = $this->logPath . '/' . $this->currentFile;
        if (!File::exists($filePath)) {
            return null;
        }

        $pattern = sprintf(
            self::REGEX_LOGIN_POSITION,
            preg_quote($username, '/'),
        );

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            return null;
        }

        try {
            while (($line = fgets($handle)) !== false) {
                if (preg_match($pattern, $line, $m)) {
                    $this->loginPositionCache[$username] = [
                        'ip' => trim(explode(':', $m[2])[0], '/'),
                        'world' => $m[4],
                        'x' => (float) $m[5],
                        'y' => (float) $m[6],
                        'z' => (float) $m[7],
                        'entity_id' => $m[3],
                    ];

                    return $this->loginPositionCache[$username];
                }
            }
        } finally {
            fclose($handle);
        }

        return null;
    }

    private function isMaliciousUser(string $username): bool
    {
        return (bool) preg_match(self::MALICIOUS_USER_PATTERN, $username);
    }
} 