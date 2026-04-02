<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyStat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 获取所有用户的简要信息.
     *
     * 返回用户名、在线状态、总在线时长及 Minecraft 头像/皮肤 URL。
     */
    public function index(): JsonResponse
    {
        return User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'username' => $user->username,
                'is_online' => $user->is_online,
                'total_online_time' => $user->total_online_time,
                'avatar_url' => "https://crafthead.net/avatar/{$user->username}",
                'skin_url' => "https://crafthead.net/skin/{$user->username}",
            ];
        });
    }

    /**
     * 获取指定日期的用户每日在线时长统计.
     *
     * @param Request $request 包含可选的 date 参数，默认为当天
     */
    public function dailyStats(Request $request): JsonResponse
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        return DailyStat::with('user')
            ->whereDate('date', $date)
            ->get()
            ->map(function ($stat) {
                return [
                    'username' => $stat->user->username,
                    'online_time' => $stat->online_time,
                    'avatar_url' => "https://crafthead.net/avatar/{$stat->user->username}",
                ];
            });
    }

    /**
     * 获取今年每天的活跃用户数统计.
     *
     * 返回一年中每天有多少不同用户登录，用于年度日历热力图。
     */
    public function yearlyCalendar(): JsonResponse
    {
        $startDate = Carbon::now()->startOfYear();
        $endDate = Carbon::now()->endOfYear();

        $stats = DailyStat::selectRaw('date, COUNT(DISTINCT user_id) as user_count')
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('date')
            ->get();

        return $stats->map(function ($stat) {
            return [
                'date' => $stat->date,
                'count' => $stat->user_count,
            ];
        });
    }
}
