<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\DailyStatResource;
use App\Http\Resources\LoginLocationResource;
use App\Http\Resources\LoginResource;
use App\Http\Resources\UserResource;
use App\Models\ChatMessage;
use App\Models\DailyStat;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use App\Services\MinecraftServerStatus;
use Illuminate\Database\Eloquent\Builder;
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
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    /**
     * 检查当前登录用户是否为管理员.
     */
    public function isAdmin(): JsonResponse
    {
        return response()->json([
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    /**
     * 获取用户列表（分页）.
     *
     * 支持按用户名搜索、按指定字段排序、在线用户优先。
     */
    public function users(Request $request): JsonResponse
    {
        $this->validateFilters($request, ['username', 'last_login_at', 'last_logout_at', 'total_online_time', 'is_scientist']);
        $isAdmin = $this->isRequestAdmin();
        $query = User::query();
        if ($isAdmin) {
            $query->with('loginLocations');
        }

        if ($request->has('search')) {
            $query->where('username', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('is_online', $request->input('status') === 'online');
        }

        if ($request->filled('sort')) {
            $this->applySort($query, $request, 'last_login_at');
        } else {
            $query->orderByDesc('is_online')->orderByDesc('last_login_at');
        }

        $users = $query->orderBy('id')->paginate($request->integer('per_page', 8))->withQueryString();
        $usersData = UserResource::collection($users->items())->toArray($request);

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($usersData), true),
                'links' => $users->linkCollection()->toArray(),
                'meta' => array_diff_key($users->toArray(), ['data' => true]),
            ],
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * 获取每日在线时长统计（分页）.
     *
     * 支持按用户名搜索、按日期倒序。
     */
    public function dailyStats(Request $request): JsonResponse
    {
        $this->validateFilters($request, ['date', 'online_time']);
        $query = DailyStat::query()
            ->with('user');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        $this->applyDateRange($query, $request, 'date');
        $this->applySort($query, $request, 'date');
        $dailyStats = $query->orderByDesc('id')->paginate($request->integer('per_page', 10))->withQueryString();
        $data = DailyStatResource::collection($dailyStats->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $dailyStats->linkCollection()->toArray(),
                'meta' => array_diff_key($dailyStats->toArray(), ['data' => true]),
            ],
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    /**
     * 获取登录记录列表（分页）.
     *
     * 支持按用户名搜索、按登录时间倒序。
     */
    public function logins(Request $request): JsonResponse
    {
        $this->validateFilters($request, ['login_at', 'logout_at', 'duration']);
        $query = Login::query()
            ->with('user');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        $this->applyDateRange($query, $request, 'login_at');
        $this->applySort($query, $request, 'login_at');
        $logins = $query->orderByDesc('id')->paginate($request->integer('per_page', 10))->withQueryString();
        $data = LoginResource::collection($logins->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $logins->linkCollection()->toArray(),
                'meta' => array_diff_key($logins->toArray(), ['data' => true]),
            ],
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    /**
     * 获取聊天消息列表（分页）.
     *
     * 支持按用户名或消息内容搜索、按发送时间倒序。
     */
    public function chat(Request $request): JsonResponse
    {
        $this->validateFilters($request, ['sent_at']);
        $query = ChatMessage::with('user');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
                // Hidden chat content must not be discoverable through public search.
                if ($this->isRequestAdmin()) {
                    $q->orWhere('content', 'like', '%'.$request->search.'%');
                }
            });
        }

        $this->applyDateRange($query, $request, 'sent_at');
        $this->applySort($query, $request, 'sent_at');
        $chatMessages = $query->orderByDesc('id')->paginate($request->integer('per_page', 8))->withQueryString();
        $data = ChatMessageResource::collection($chatMessages->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $chatMessages->linkCollection()->toArray(),
                'meta' => array_diff_key($chatMessages->toArray(), ['data' => true]),
            ],
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    /**
     * 获取登录位置记录列表（分页）.
     *
     * 支持按用户名搜索、按记录时间倒序。
     */
    public function loginLocations(Request $request): JsonResponse
    {
        $this->validateFilters($request, ['login_at']);
        $query = LoginLocation::query()
            ->with(['user', 'login']);

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('start_date') || $request->filled('end_date')) {
            $query->whereHas('login', function (Builder $query) use ($request) {
                $this->applyDateRange($query, $request, 'login_at');
            });
        }
        if ($request->filled('sort')) {
            $query->leftJoin('logins', 'login_locations.login_id', '=', 'logins.id')->select('login_locations.*');
            $this->applySort($query, $request, 'logins.login_at', ['login_at' => 'logins.login_at']);
        } else {
            $query->latest('login_locations.created_at');
        }
        $locations = $query->orderByDesc('login_locations.id')->paginate($request->integer('per_page', 10))->withQueryString();
        $data = LoginLocationResource::collection($locations->items());

        return response()->json([
            'paginatedData' => [
                'data' => json_decode(json_encode($data), true),
                'links' => $locations->linkCollection()->toArray(),
                'meta' => array_diff_key($locations->toArray(), ['data' => true]),
            ],
            'isAdmin' => $this->isRequestAdmin(),
        ]);
    }

    private function validateFilters(Request $request, array $allowedSorts): void
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => array_filter(['nullable', 'date_format:Y-m-d', $request->filled('start_date') ? 'after_or_equal:start_date' : null]),
            'status' => ['nullable', 'in:online,offline'],
            'sort' => ['nullable', 'string', 'in:'.implode(',', $allowedSorts)],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);
    }

    private function applySort(Builder $query, Request $request, string $default, array $columns = []): void
    {
        // sort is validated against each endpoint's fixed allowlist before reaching here.
        $sort = $request->input('sort') ?: $default;
        $column = $columns[$sort] ?? $sort;
        $direction = $request->input('direction') ?: 'desc';
        // Missing dates / unfinished durations always appear last, in either direction.
        $query->orderByRaw($column.' IS NULL')->orderBy($column, $direction);
    }

    private function applyDateRange(Builder $query, Request $request, string $column): void
    {
        if ($request->filled('start_date')) {
            $query->whereDate($column, '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate($column, '<=', $request->input('end_date'));
        }
    }

    private function isRequestAdmin(): bool
    {
        return (bool) (Auth::user()?->is_admin);
    }
}
