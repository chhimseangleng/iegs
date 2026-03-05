<?php

namespace App\Http\Controllers;

use App\Models\MoneyHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $query = auth()->user()->moneyHistories()
            ->with('source')
            ->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('source_type', 'like', "%{$search}%");
            });
        }

        return Inertia::render('history/index', [
            'history' => $query->paginate(25)->withQueryString(),
            'filters' => [
                'search' => $search
            ]
        ]);
    }
}
