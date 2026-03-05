<?php

namespace App\Http\Controllers;

use App\Models\Income;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class IncomeController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('income/index', [
            // PAGINATED DATA (table only)
            'incomes' => $user->incomes()
                ->with('category')
                ->latest()
                ->paginate(10)
                ->withQueryString(),

            // GLOBAL STATS (ALL RECORDS)
            'stats' => [
                'total_income' => $user->incomes()->sum('amount'),
                'highest_income' => $user->incomes()->max('amount'),
                'transaction_count' => $user->incomes()->count(),
            ],

            'categories' => $user->categories()
                ->where('type', 'income')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'income_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated) {
            $income = auth()->user()->incomes()->create($validated);
            
            $income->moneyHistory()->create([
                'user_id' => auth()->id(),
                'type' => 'in',
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'transaction_date' => $validated['income_date'],
            ]);
        });

        return back()->with('success', 'Income record created successfully.');
    }

    public function update(Request $request, Income $income)
    {
        if ($income->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'income_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated, $income) {
            $income->update($validated);
            
            $income->moneyHistory()->update([
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'transaction_date' => $validated['income_date'],
            ]);
        });

        return back()->with('success', 'Income record updated successfully.');
    }

    public function destroy(Income $income)
    {
        if ($income->user_id !== auth()->id()) {
            abort(403);
        }

        DB::transaction(function () use ($income) {
            $income->moneyHistory()->delete();
            $income->delete();
        });

        return back()->with('success', 'Income record deleted successfully.');
    }
}
