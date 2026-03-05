<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(): Response
{
    $user = auth()->user();

    return Inertia::render('expense/index', [
        // PAGINATED DATA (table only)
        'expenses' => $user->expenses()
            ->with('category')
            ->latest()
            ->paginate(10)
            ->withQueryString(),

        // GLOBAL STATS (ALL RECORDS)
        'stats' => [
            'total_expense' => $user->expenses()->sum('amount'),
            'highest_expense' => $user->expenses()->max('amount'),
            'transaction_count' => $user->expenses()->count(),
        ],

        'categories' => $user->categories()
            ->where('type', 'expense')
            ->get(),
    ]);
}


    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'expense_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated) {
            $expense = auth()->user()->expenses()->create($validated);

            $expense->moneyHistory()->create([
                'user_id' => auth()->id(),
                'type' => 'out',
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'transaction_date' => $validated['expense_date'],
            ]);
        });

        return back()->with('success', 'Expense record created successfully.');
    }

    public function update(Request $request, Expense $expense)
    {
        if ($expense->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'expense_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated, $expense) {
            $expense->update($validated);

            $expense->moneyHistory()->update([
                'amount' => $validated['amount'],
                'description' => $validated['description'],
                'transaction_date' => $validated['expense_date'],
            ]);
        });

        return back()->with('success', 'Expense record updated successfully.');
    }

    public function destroy(Expense $expense)
    {
        if ($expense->user_id !== auth()->id()) {
            abort(403);
        }

        DB::transaction(function () use ($expense) {
            $expense->moneyHistory()->delete();
            $expense->delete();
        });

        return back()->with('success', 'Expense record deleted successfully.');
    }
}
