<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\DailyStatResource;
use App\Http\Resources\LoginLocationResource;
use App\Http\Resources\LoginResource;
use App\Models\ChatMessage;
use App\Models\DailyStat;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use App\Services\MinecraftServerStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiController extends Controller
{
    /**
     * 获取服务器状态和当前用户权限.
     */
    public function serverStatus(MinecraftServerStatus $mcStatus): JsonResponse
    {
        $serverStatus = $mcStatus->getServerStatus();

        return response()->json([
            'serverStatus' => $serverStatus,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 检查当前登录用户是否为管理员.
     */
    public function isAdmin(): JsonResponse
    {
        return response()->json([
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 获取用户列表（分页）.
     *
     * 支持按用户名搜索、按指定字段排序、在线用户优先。
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with('loginLocations');

        if ($request->has('search')) {
            $query->where('username', 'like', '%' . $request->search . '%');
        }

        $query->orderBy('is_online', 'desc')
            ->orderBy('last_login_at', 'desc');

        $sort = $request->get('sort');
        $direction = in_array($request->get('direction'), ['asc', 'desc']) ? $request->get('direction') : 'asc';
        $allowedSorts = ['username', 'last_logout_at', 'total_online_time', 'is_scientist'];

        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $users = $query->paginate(8);

        return response()->json([
            'paginatedData' => $users,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 获取每日在线时长统计（分页）.
     *
     * 支持按用户名搜索、按日期倒序。
     */
    public function dailyStats(Request $request): JsonResponse
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
        $data = DailyStatResource::collection($dailyStats->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $dailyStats->linkCollection()->toArray(),
                'meta' => array_diff_key($dailyStats->toArray(), ['data' => true]),
            ],
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 获取登录记录列表（分页）.
     *
     * 支持按用户名搜索、按登录时间倒序。
     */
    public function logins(Request $request): JsonResponse
    {
        $query = Login::query()
            ->with('user')
            ->latest('login_at');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%');
            });
        }

        $logins = $query->paginate(10);
        $data = LoginResource::collection($logins->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $logins->linkCollection()->toArray(),
                'meta' => array_diff_key($logins->toArray(), ['data' => true]),
            ],
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 获取聊天消息列表（分页）.
     *
     * 支持按用户名或消息内容搜索、按发送时间倒序。
     */
    public function chat(Request $request): JsonResponse
    {
        $query = ChatMessage::with('user')->orderBy('sent_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%')
                    ->orWhere('content', 'like', '%' . $request->search . '%');
            });
        }

        $chatMessages = $query->paginate(8);
        $data = ChatMessageResource::collection($chatMessages->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $chatMessages->linkCollection()->toArray(),
                'meta' => array_diff_key($chatMessages->toArray(), ['data' => true]),
            ],
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    /**
     * 获取登录位置记录列表（分页）.
     *
     * 支持按用户名搜索、按记录时间倒序。
     */
    public function loginLocations(Request $request): JsonResponse
    {
        $query = LoginLocation::query()
            ->with(['user', 'login'])
            ->latest();

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%');
            });
        }

        $locations = $query->paginate(10);
        $data = LoginLocationResource::collection($locations->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $locations->linkCollection()->toArray(),
                'meta' => array_diff_key($locations->toArray(), ['data' => true]),
            ],
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
