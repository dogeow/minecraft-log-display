<?php

namespace App\Http\Controllers;

use App\Models\LoginLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginLocation::query()
            ->with(['user', 'login'])
            ->latest();

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', "%{$request->search}%");
            });
        }

        $locations = $query->paginate(10);

        return view('app', [
            'paginatedData' => $locations,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
