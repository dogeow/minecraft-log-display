<?php

namespace App\Console\Commands;

use App\Models\ChatMessage;
use App\Models\DailyStat;
use App\Models\Login;
use App\Models\User;
use App\Services\MinecraftLogService;
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
    private array $pendingLoginsForLocation = [];

    private const MALICIOUS_USER_PATTERN = '/^Cornbread\d+$/';

    private const REGEX_UUID = '/^\[(.*?)\] \[User Authenticator.*?\]: UUID of player (.*?) is ([0-9a-f-]+)/';
    private const REGEX_LOGIN = '/^\[(.*?)\] \[Craft Scheduler Thread.*?AuthMe\/INFO\]: \[AuthMe\] (.*?) logged in/';
    private const REGEX_LOGOUT = '/^\[(.*?)\] \[Server thread\/INFO\]: (.*?) left the game/';
    private const REGEX_CHAT = '/^\[(.*?)\] \[Async Chat Thread.*?\/INFO\]: \[Not Secure\] <(.*?)> (.*)/';
    private const REGEX_SCIENTIST = '/^\[(.*?)\] \[Server thread\/WARN\]: (.*?) moved wrongly!/';
    private const REGEX_LOGIN_POSITION = '/^\[(.*?)\] \[Server thread\/INFO\]: (.*?)\[(.*?)\] logged in with entity id (\d+) at \(\[(.*?)\](.*?), (.*?), (.*?)\)/';
    private const REGEX_DATE_FILE = '/^(\d{4}-\d{2}-\d{2})-\d+\.log$/';
    private const REGEX_LOG_TIME = '/(\d{2}:\d{2}:\d{2})/';

    private string $logPath;

    public function __construct(
        private readonly MinecraftLogService $logService,
    ) {
        parent::__construct();
        $this->logPath = config('minecraft.log_path');
    }

    /**
     * 导入 Minecraft 历史日志文件.
     *
     * 扫描日志目录中的所有日志文件，按文件名排序逐个处理，提取登录、登出、聊天等事件，
     * 并记录到数据库。可选清空现有数据后重新导入。
     */
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

    /**
     * 获取并排序日志文件列表.
     *
     * 只返回 latest.log 和符合日期格式 (YYYY-MM-DD-N.log) 的文件，
     * 按文件名排序，latest.log 排在最后。
     */
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

    /**
     * 清空所有相关数据表.
     *
     * 在重新导入历史日志前调用，truncate 方式清空 User、Login、DailyStat、ChatMessage 表。
     */
    private function clearData(): void
    {
        $this->info('清空数据...');
        User::truncate();
        Login::truncate();
        DailyStat::truncate();
        ChatMessage::truncate();
        $this->info('数据清空完成');
    }

    /**
     * 流式读取并处理单个日志文件.
     *
     * 使用 fopen/fgets 逐行读取，避免一次性加载大文件到内存。
     */
    private function processFile(string $path): void
    {
        $this->pendingLoginsForLocation = [];

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->error("无法打开文件: {$path}");

            return;
        }

        try {
            while (($line = fgets($handle)) !== false) {
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

    /**
     * 解析单行日志并分发到对应的处理方法.
     *
     * 依次匹配 UUID、登录、登出、科学家标记、聊天消息等日志行格式。
     */
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

        if ($position = $this->parseLoginPosition($line)) {
            $this->logService->cacheLoginPosition($position['username'], $position);
            $this->applyPendingLoginLocation($position);

            return;
        }

        // 登录
        if (preg_match(self::REGEX_LOGIN, $line, $m)) {
            try {
                $timestamp = $this->parseTimestamp($m[1]);
                $username = $m[2];
                $uuid = $this->findUuid($username);
                $loginPosition = $this->logService->pullLoginPosition($username);
                $this->handleLogin($username, $uuid, $timestamp, $loginPosition);
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

    /**
     * 从日志行解析时间戳.
     *
     * 日期从当前处理的文件名获取（latest.log 使用当天日期），
     * 时间从日志行中 HH:MM:SS 格式提取。
     */
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

    /**
     * 从当前文件名中提取日期部分.
     *
     * 匹配格式 YYYY-MM-DD-N.log，提取 YYYY-MM-DD 部分。
     */
    private function extractDateFromFile(): string
    {
        if (!preg_match(self::REGEX_DATE_FILE, $this->currentFile, $m)) {
            throw new \Exception('无法从文件名解析日期: ' . $this->currentFile);
        }

        return $m[1];
    }

    /**
     * 处理用户登录事件.
     *
     * 创建登录记录、更新用户状态，并尝试为登录记录补充位置信息。
     * 跳过 1 分钟内的重复登录和恶意用户。
     */
    private function handleLogin(string $username, string $uuid, Carbon $timestamp, ?array $loginPosition = null): void
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

        if ($loginPosition !== null) {
            $this->logService->createLoginLocation($login, $user, $loginPosition);
        } else {
            $this->pendingLoginsForLocation[$username] = [
                'login_id' => $login->id,
                'user_id' => $user->id,
            ];
        }

        $user->update([
            'is_online' => true,
            'last_login_at' => $timestamp,
        ]);

        $this->info("用户 {$username} 在 {$timestamp} 登录");
    }

    /**
     * 处理用户登出事件.
     *
     * 计算在线时长，更新登录记录的登出时间和时长，
     * 累加用户总在线时间，并更新每日统计数据。
     */
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
            unset($this->pendingLoginsForLocation[$username]);

            return;
        }

        $login = $user->logins()->whereNull('logout_at')->latest()->first();
        if (!$login) {
            unset($this->currentLogin[$username]);
            unset($this->pendingLoginsForLocation[$username]);

            return;
        }

        if ($timestamp->lt($login->login_at)) {
            $this->warn("警告: {$username} 的登出时间早于登录时间，跳过");
            unset($this->pendingLoginsForLocation[$username]);

            return;
        }

        $duration = $login->login_at->diffInSeconds($timestamp);
        if ($duration <= 0) {
            unset($this->currentLogin[$username]);
            unset($this->pendingLoginsForLocation[$username]);

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
        unset($this->pendingLoginsForLocation[$username]);
    }

    /**
     * 更新用户的每日在线时长统计.
     *
     * 根据登录日期找到或创建对应的 DailyStat 记录，
     * 并累加当天的在线时长。
     */
    private function updateDailyStats(User $user, Login $login, int $duration): void
    {
        $date = $login->created_at->toDateString();
        $dailyStat = $user->dailyStats()->firstOrCreate(
            ['date' => $date],
            ['online_time' => 0],
        );
        $dailyStat->increment('online_time', $duration);
    }

    /**
     * 从缓存中查找用户的 UUID.
     *
     * UUID 在处理登录前通过日志中的 User Authenticator 行预先缓存。
     * 找到后从缓存中移除，确保每次登录只使用一次。
     */
    private function findUuid(string $username): string
    {
        if (isset($this->uuidCache[$username])) {
            $uuid = $this->uuidCache[$username];
            unset($this->uuidCache[$username]);

            return $uuid;
        }

        throw new \Exception('无法找到用户 ' . $username . ' 的 UUID');
    }

    private function parseLoginPosition(string $line): ?array
    {
        if (!preg_match(self::REGEX_LOGIN_POSITION, $line, $m)) {
            return null;
        }

        return [
            'username' => $m[2],
            'ip' => trim(explode(':', $m[3])[0], '/'),
            'world' => $m[5],
            'x' => (float) $m[6],
            'y' => (float) $m[7],
            'z' => (float) $m[8],
            'entity_id' => $m[4],
        ];
    }

    private function applyPendingLoginLocation(array $position): void
    {
        $username = $position['username'];
        if (!isset($this->pendingLoginsForLocation[$username])) {
            return;
        }

        $pending = $this->pendingLoginsForLocation[$username];
        $login = Login::find($pending['login_id']);
        $user = User::find($pending['user_id']);

        if (!$login || !$user) {
            unset($this->pendingLoginsForLocation[$username]);

            return;
        }

        $this->logService->createLoginLocation($login, $user, $position);

        unset($this->pendingLoginsForLocation[$username]);
    }

    /**
     * 检查用户名是否为恶意用户.
     *
     * 目前匹配模式 ^Cornbread\d+$，匹配则跳过该用户的所有操作。
     */
    private function isMaliciousUser(string $username): bool
    {
        return (bool) preg_match(self::MALICIOUS_USER_PATTERN, $username);
    }
}
