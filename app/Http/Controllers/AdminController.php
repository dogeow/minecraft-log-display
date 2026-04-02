<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AdminController extends Controller
{
    /**
     * 显示管理员登录表单.
     *
     * 已登录的管理员直接跳转到首页。
     */
    public function showLoginForm(): View|RedirectResponse
    {
        if (Auth::check() && Auth::user()->is_admin) {
            return redirect('/');
        }

        $errors = session('errors') ? session('errors')->all() : [];

        return view('app', [
            'errors' => $errors,
            'isAdmin' => false,
        ]);
    }

    /**
     * 处理管理员登录请求.
     *
     * 验证凭据，仅允许 is_admin 为 true 的用户登录。
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            if ($user->is_admin) {
                $request->session()->regenerate();

                return redirect()->intended('/');
            }

            Auth::logout();

            return back()->withErrors([
                'username' => '您不是管理员',
            ]);
        }

        return back()->withErrors([
            'username' => '用户名或密码错误',
        ]);
    }

    /**
     * 处理管理员登出.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
