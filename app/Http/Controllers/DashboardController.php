<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        // 1. Summary Cards Data
        $totalIncome = (float) $user->incomes()->sum('amount');
        $totalExpense = (float) $user->expenses()->sum('amount');
        $totalSaving = (float) $user->savings()->sum('amount');
        $balance = $totalIncome - $totalExpense - $totalSaving;

        // 2. Monthly Stats (Last 6 Months) for Bar Chart
        $monthlyStats = collect([]);
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthName = $date->format('M');
            $year = $date->format('Y');
            $monthNumber = $date->month;

            $income = $user->incomes()
                ->whereYear('income_date', $year)
                ->whereMonth('income_date', $monthNumber)
                ->sum('amount');

            $expense = $user->expenses()
                ->whereYear('expense_date', $year)
                ->whereMonth('expense_date', $monthNumber)
                ->sum('amount');

            $monthlyStats->push([
                'name' => $monthName,
                'Income' => (float) $income,
                'Expense' => (float) $expense,
            ]);
        }

        // 3. Expense by Category (Pie Chart)
        $expenseCategories = $user->expenses()
            ->select('category_id', DB::raw('sum(amount) as total'))
            ->with('category')
            ->groupBy('category_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category ? $item->category->name : 'Uncategorized',
                    'value' => (float) $item->total,
                ];
            });

        // 4. Recent Transactions (Mixed Income and Expense)
        $recentIncomes = $user->incomes()
            ->with('category')
            ->latest('income_date')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => 'inc-' . $item->id,
                    'type' => 'income',
                    'description' => $item->description ?? 'Income',
                    'amount' => (float) $item->amount,
                    'date' => $item->income_date->format('Y-m-d'),
                    'category' => 'Income',
                ];
            });

        $recentExpenses = $user->expenses()
            ->with('category')
            ->latest('expense_date')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => 'exp-' . $item->id,
                    'type' => 'expense',
                    'description' => $item->description ?? 'Expense',
                    'amount' => (float) $item->amount,
                    'date' => $item->expense_date->format('Y-m-d'),
                    'category' => $item->category ? $item->category->name : 'Uncategorized',
                ];
            });

        // Merge and sort for recent history list
        $recentTransactions = $recentIncomes->merge($recentExpenses)
            ->sortByDesc('date')
            ->take(5)
            ->values();

        // 5. Active Goals
        $goals = $user->goals()
            ->where('status', 'in_progress')
            ->latest()
            ->take(3)
            ->get();

        return Inertia::render('dashboard', [
            'balance' => $balance,
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'monthlyStats' => $monthlyStats,
            'expenseCategories' => $expenseCategories,
            'recentTransactions' => $recentTransactions,
            'goals' => $goals,
        ]);
    }
}
