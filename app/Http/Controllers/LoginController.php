<?php

namespace App\Http\Controllers;

use App\Models\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * 显示登录记录页面（分页）.
     *
     * 支持按用户名搜索，关联加载用户信息，按登录时间倒序。
     */
    public function index(Request $request)
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

        return view('app', [
            'paginatedData' => $logins,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
