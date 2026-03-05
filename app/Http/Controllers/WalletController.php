<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function index(): Response
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        
        $totalIncome = (float) $user->incomes()->sum('amount');
        $totalExpense = (float) $user->expenses()->sum('amount');
        $totalSaving = (float) $user->savings()->sum('amount');
        
        $balance = $totalIncome - $totalExpense - $totalSaving;

        return Inertia::render('wallet/index', [
            'balance' => $balance,
            'totalIncomes' => $totalIncome,
            'totalExpenses' => $totalExpense,
            'totalSaving' => $totalSaving
        ]);
    }
}
