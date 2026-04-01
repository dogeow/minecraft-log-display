<?php

namespace App\Http\Controllers;

use App\Models\DailyStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DailyStatController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyStat::query()
            ->with('user')
            ->latest('date');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', 'like', "%{$request->search}%");
            });
        }

        $dailyStats = $query->paginate(10);

        return view('app', [
            'paginatedData' => $dailyStats,
            'isAdmin' => Auth::check() && Auth::user()->is_admin,
        ]);
    }
}
