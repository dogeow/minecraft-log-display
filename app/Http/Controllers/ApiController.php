<?php

namespace App\Http\Controllers;

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
    public function serverStatus(MinecraftServerStatus $mcStatus): JsonResponse
    {
        $serverStatus = $mcStatus->getServerStatus();

        return response()->json([
            'serverStatus' => $serverStatus,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::with('loginLocations');

        if ($request->has('search')) {
            $query->where('username', 'like', '%'.$request->search.'%');
        }

        $query->orderBy('is_online', 'desc')
            ->orderBy('last_login_at', 'desc');

        $sort = $request->get('sort');
        $direction = $request->get('direction', 'asc');
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

    public function dailyStats(Request $request): JsonResponse
    {
        $query = DailyStat::query()
            ->with('user')
            ->latest('date');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        $dailyStats = $query->paginate(10);

        return response()->json([
            'paginatedData' => $dailyStats,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function logins(Request $request): JsonResponse
    {
        $query = Login::query()
            ->with('user')
            ->latest('login_at');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        $logins = $query->paginate(10);

        return response()->json([
            'paginatedData' => $logins,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $query = ChatMessage::with('user')->orderBy('sent_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%')
                    ->orWhere('content', 'like', '%'.$request->search.'%');
            });
        }

        $chatMessages = $query->paginate(8);

        return response()->json([
            'paginatedData' => $chatMessages,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function loginLocations(Request $request): JsonResponse
    {
        $query = LoginLocation::query()
            ->with(['user', 'login'])
            ->latest();

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%');
            });
        }

        $locations = $query->paginate(10);

        return response()->json([
            'paginatedData' => $locations,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
