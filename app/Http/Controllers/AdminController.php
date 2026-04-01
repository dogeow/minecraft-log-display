<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function showLoginForm()
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

    public function login(Request $request)
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

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
