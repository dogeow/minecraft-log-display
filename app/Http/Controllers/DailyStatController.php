<?php

namespace App\Http\Controllers;

use App\Models\DailyStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DailyStatController extends Controller
{
    /**
     * 显示每日在线时长统计页面（分页）.
     *
     * 支持按用户名搜索，按日期倒序。
     */
    public function index(Request $request)
    {
        $query = DailyStat::query()
            ->with('user')
            ->latest('date');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%');
            });
        }

        $dailyStats = $query->paginate(10);

        return view('app', [
            'paginatedData' => $dailyStats,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
