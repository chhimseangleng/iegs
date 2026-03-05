<?php

namespace App\Http\Controllers;

use App\Models\Saving;
use App\Models\Goal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class SavingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('saving/index', [
            'savings' => auth()->user()->savings()->with('goal')->latest()->get(),
            'goals' => auth()->user()->goals()->where('status', '!=', 'completed')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'goal_id' => 'required|exists:goals,id',
            'amount' => 'required|numeric|min:0',
            'saving_date' => 'required|date',
            'note' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            $saving = auth()->user()->savings()->create($validated);
            
            // Sync with MoneyHistory
            $saving->moneyHistory()->create([
                'user_id' => auth()->id(),
                'type' => 'out', // Savings considered as moving money out of current wallet
                'amount' => $validated['amount'],
                'description' => "Saving for goal: " . $saving->goal->name,
                'transaction_date' => $validated['saving_date'],
            ]);

            // Sync with Goal
            $goal = $saving->goal;
            $goal->increment('current_amount', $validated['amount']);
        });

        return back()->with('success', 'Saving record created successfully.');
    }

    public function update(Request $request, Saving $saving)
    {
        if ($saving->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'goal_id' => 'required|exists:goals,id',
            'amount' => 'required|numeric|min:0',
            'saving_date' => 'required|date',
            'note' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $saving) {
            $oldAmount = $saving->amount;
            $oldGoalId = $saving->goal_id;

            $saving->update($validated);
            
            // Update MoneyHistory
            $saving->moneyHistory()->update([
                'amount' => $validated['amount'],
                'transaction_date' => $validated['saving_date'],
            ]);

            // Update Goal(s)
            if ($oldGoalId == $validated['goal_id']) {
                $goal = $saving->goal;
                $goal->increment('current_amount', $validated['amount'] - $oldAmount);
            } else {
                // Goal changed
                Goal::find($oldGoalId)->decrement('current_amount', $oldAmount);
                Goal::find($validated['goal_id'])->increment('current_amount', $validated['amount']);
            }
        });

        return back()->with('success', 'Saving record updated successfully.');
    }

    public function destroy(Saving $saving)
    {
        if ($saving->user_id !== auth()->id()) {
            abort(403);
        }

        DB::transaction(function () use ($saving) {
            // Decrement Goal amount
            $saving->goal->decrement('current_amount', $saving->amount);
            
            // Delete MoneyHistory and Saving
            $saving->moneyHistory()->delete();
            $saving->delete();
        });

        return back()->with('success', 'Saving record deleted successfully.');
    }
}
