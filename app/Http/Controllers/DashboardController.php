<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\User;
use App\Services\MinecraftServerStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(MinecraftServerStatus $mcStatus)
    {
        $serverStatus = $mcStatus->getServerStatus();

        return view('app', [
            'serverStatus' => $serverStatus,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function users(Request $request)
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

        return view('app', [
            'paginatedData' => $users,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }

    public function chat(Request $request)
    {
        $query = ChatMessage::with('user')->orderBy('sent_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('username', 'like', '%'.$request->search.'%')
                    ->orWhere('content', 'like', '%'.$request->search.'%');
            });
        }

        $chatMessages = $query->paginate(8);

        return view('app', [
            'paginatedData' => $chatMessages,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
