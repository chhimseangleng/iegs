<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('goal/index', [
            'goals' => auth()->user()->goals()->latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'target_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|max:50',
            'image' => 'nullable|image|max:2048',
        ]);

        $validated['current_amount'] = 0;

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('goals', 'public');
        }

        auth()->user()->goals()->create($validated);

        return back()->with('success', 'Goal created successfully.');
    }

    public function update(Request $request, Goal $goal)
    {
        if ($goal->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'target_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|max:50',
            'current_amount' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($goal->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($goal->image);
            }
            $validated['image'] = $request->file('image')->store('goals', 'public');
        }

        $goal->update($validated);

        return back()->with('success', 'Goal updated successfully.');
    }

    public function destroy(Goal $goal)
    {
        if ($goal->user_id !== auth()->id()) {
            abort(403);
        }

        if ($goal->image) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($goal->image);
        }

        $goal->delete();

        return back()->with('success', 'Goal deleted successfully.');
    }
}
