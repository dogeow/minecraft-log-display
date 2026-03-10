<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ChatMessage;
use App\Models\LoginLocation;
use Illuminate\Support\Facades\DB;
use App\Services\MinecraftServerStatus;

class DashboardController extends Controller
{
    public function index(MinecraftServerStatus $mcStatus)
    {
        $serverStatus = $mcStatus->getServerStatus();

        return view('dashboard', compact('serverStatus'));
    }

    public function users(Request $request)
    {
        $query = User::with('loginLocations');

        // 添加搜索功能
        if ($request->has('search')) {
            $query->where('username', 'like', '%' . $request->search . '%');
        }

        // 默认排序：在线用户优先，然后按最后登录时间倒序
        $query->orderBy('is_online', 'desc')
              ->orderBy('last_login_at', 'desc');

        // 如果有其他排序参数，则应用它们
        $sort = $request->get('sort');
        $direction = $request->get('direction', 'asc');
        $allowedSorts = ['username', 'last_logout_at', 'total_online_time', 'is_scientist'];
        
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }
        
        $users = $query->paginate(8);

        return view('users', compact('users'));
    }

    public function chat(Request $request)
    {
        $query = ChatMessage::with('user')->orderBy('sent_at', 'desc');

        // 添加搜索功能
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%')
                  ->orWhere('content', 'like', '%' . $request->search . '%');
            });
        }

        $chatMessages = $query->paginate(8);

        return view('chat', compact('chatMessages'));
    }
} 
